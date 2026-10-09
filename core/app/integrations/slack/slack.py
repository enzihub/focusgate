# slack.py

import asyncio
import time
from asyncio import to_thread
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

import inflect
import pytz

p = inflect.engine()
import jinja2
from fastapi import HTTPException

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.signature import SignatureVerifier
from slack_sdk.web.async_client import AsyncWebClient

from app.core.ai.ai_config import model
from app.core.ai.prompts import SLACK_SUMMARY_PROMPT, SLACK_SUMMARY_SLACK_MESSAGE_PROMPT
from app.core.config.config import settings
from app.core.config.logger import logger

# In-memory cache for users
users_cache = {}
users_cache_expiry = None
CACHE_TTL = 3600  # 1 hour
SLACK_SIGNING_SECRET = settings.SLACK_SIGNING_SECRET
SLACK_BOT_TOKEN = settings.SLACK_BOT_TOKEN
signature_verifier = SignatureVerifier(signing_secret=SLACK_SIGNING_SECRET)
slack_client = WebClient(token=SLACK_BOT_TOKEN)


async def generate_slack_summary(slack_token: str, is_for_slack=False):
    try:
        all_messages = await get_all_user_messages(slack_token)

        # Pass the user's token to get_user_slack_mapping
        processed_messages = await preprocess_messages(all_messages, slack_token)

        if is_for_slack:
            prompt = SLACK_SUMMARY_SLACK_MESSAGE_PROMPT
        else:
            prompt = SLACK_SUMMARY_PROMPT

        prompt = prompt.format(content=processed_messages,
                               date=datetime.now(),
                               user_name="FocusGate")
        # response = model.generate_content(prompt)
        response = await to_thread(model.generate_content, prompt)
        raw_text = response.text.strip()
        cleaned_text = raw_text

        # Remove backticks and check for html tags
        if raw_text.startswith('```html'):
            cleaned_text = raw_text[7:-3].strip()  # Remove ```html and ending ```
        return cleaned_text
    except Exception as e:
        raise e


async def preprocess_messages(messages, slack_token=None):
    # Get users mapping for the specific workspace
    users_json = await get_user_slack_mapping(slack_token)
    processed_messages = "\n".join(
        [
            f"{users_json.get(msg['user'], 'Unknown User')}: {replace_mentions(msg['text'].strip(), users_json)}"
            for msg in messages
            if msg.get('user')
        ]
    )
    return processed_messages


async def process_summary(channel_id, option, user_id):
    """
    This function is called by the /news
    """
    try:
        now = datetime.now()
        timestamp = now.strftime("%m/%d/%y %H:%M:%S")

        # Get conversation history from Slack
        conversation_history = slack_client.conversations_history(
            channel=channel_id, limit=20
        )
        messages = conversation_history.get("messages", [])

        processed_messages = await preprocess_messages(messages)

        # Format the prompt using the template
        prompt = SLACK_SUMMARY_PROMPT.format(content=processed_messages)

        # Generate summary using your OpenAI client
        # response = await openai.generate_content(prompt=prompt)
        response = model.generate_content(prompt)
        response = response.text

        summary = response.strip()

        # Post the summary to Slack
        if option["ephemeral"]:
            slack_client.chat_postEphemeral(
                channel=channel_id,
                text=f"*{timestamp}*\n{summary}",
                user=user_id,
            )
        else:
            slack_client.chat_postMessage(
                channel=channel_id,
                text=f"*{timestamp}*\n{summary}",
            )

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_newsletter_for_slack(channel_id, user_id, option):
    """Process and post newsletter directly to Slack"""
    try:
        token = SLACK_BOT_TOKEN

        # Default timezone to UTC
        user_timezone = "UTC"

        # Only try to get user timezone if user_id is provided and not empty
        if user_id and user_id.strip():
            try:
                user_info = slack_client.users_info(user=user_id)
                user_timezone = user_info.get("user", {}).get("tz", "UTC")
            except Exception as tz_error:
                logger.warning(f"Could not get user timezone, using UTC: {str(tz_error)}")

        # Generate newsletter content with is_for_slack=True to skip HTML templating
        newsletter_data = await generate_newsletter_content(token, user_timezone, is_for_slack=True)

        if not newsletter_data:
            logger.error("Failed to generate newsletter")
            if option.get("ephemeral") and user_id:
                slack_client.chat_postEphemeral(
                    channel=channel_id,
                    text="Failed to generate newsletter content.",
                    user=user_id,
                )
            return {"status": "failed", "error": "Could not generate newsletter content"}

        # Format for Slack
        user_tz = pytz.timezone(user_timezone)
        now = datetime.now().astimezone(user_tz)
        day_of_week = now.strftime("%A")
        date = now.strftime("%b %d")

        # Add greeting
        greeting = f"Good {day_of_week}!\nIt's {date}. Here's your executive summary for today.\n\n"

        # Use the content directly (it's already in plain text format)
        formatted_content = f"*{newsletter_data['subject']}*\n\n{greeting}{newsletter_data['body']}"

        # Post to Slack
        if option.get("ephemeral") and user_id and user_id.strip():
            slack_client.chat_postEphemeral(
                channel=channel_id,
                text=formatted_content,
                user=user_id,
            )
        else:
            slack_client.chat_postMessage(
                channel=channel_id,
                text=formatted_content,
            )

        return {"status": "newsletter posted to Slack"}
    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        logger.error(f"Error processing newsletter for Slack: {str(e)}")

        # Only try to send error message if we have a valid user_id
        if user_id and user_id.strip():
            try:
                slack_client.chat_postEphemeral(
                    channel=channel_id,
                    text=error_message,
                    user=user_id,
                )
            except Exception as post_error:
                logger.error(f"Failed to post error message to Slack: {str(post_error)}")

        # For Celery tasks, returning an error is better than raising an exception
        return {"status": "error", "message": str(e)}


async def get_user_slack_mapping(token: str = None):
    """
    Get user mapping for a specific workspace using the provided token
    or default bot token if none provided
    """
    client = WebClient(token=token) if token else slack_client

    try:
        # First, get the workspace ID
        auth_response = client.auth_test()
        workspace_id = auth_response["team_id"]

        # Check if we have a valid cache for this workspace
        cache_data = users_cache.get(workspace_id)
        if cache_data and cache_data['expiry'] > time.time():
            return cache_data['users']

        # Fetch all users from Slack API
        response = client.users_list()
        users = response.get("members", [])

        # Filter active users and build the mapping
        active_users_dict = {
            user["id"]: user["real_name"].split()[0].capitalize()
            for user in users
            if not user.get("deleted", False) and not user.get("is_bot", False)
        }

        # Update cache for this specific workspace
        users_cache[workspace_id] = {
            'users': active_users_dict,
            'expiry': time.time() + CACHE_TTL
        }

        return active_users_dict
    except SlackApiError as e:
        logger.error(f"Error fetching users: {e.response['error']}")
        raise e


def replace_mentions(text, users_json):
    """
    Replace all mentions (<@USER_ID>) in the message text with the corresponding users' names.
    """
    for user_id in users_json:
        mention = f"<@{user_id}>"
        if mention in text:
            text = text.replace(mention, users_json[user_id])
    return text


async def get_all_user_messages(token: str) -> List[Dict]:
    """Fetch all messages from all channels for a user within the last 24 hours"""
    try:
        client = AsyncWebClient(token=token)

        # Calculate timestamp for 24 hours ago
        oldest_timestamp = str(int(time.time() - 24 * 60 * 60))

        # Fetch all conversations in parallel
        conversations_response = await client.users_conversations(
            types="public_channel,private_channel",
            limit=1000,
            exclude_archived=True
        )

        channels = conversations_response.get('channels', [])

        # Log channel names in a single line
        channel_names = ", ".join([channel.get('name', 'Unknown') for channel in channels])
        logger.info(f"Channels: {channel_names}")

        # Create tasks for all channels
        tasks = [
            fetch_channel_messages(
                client=client,
                channel_id=channel['id'],
                channel_name=channel.get('name', 'Unknown'),
                oldest_timestamp=oldest_timestamp
            )
            for channel in channels
        ]

        # Execute all tasks concurrently with rate limiting
        all_channel_messages = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten and filter out errors
        all_messages = []
        for result in all_channel_messages:
            if isinstance(result, list):
                all_messages.extend(result)
            else:
                logger.error(f"Error fetching messages: {str(result)}")

        # Sort messages by timestamp
        all_messages.sort(key=lambda x: float(x['timestamp']), reverse=True)

        logger.info(f"Retrieved {len(all_messages)} messages from {len(channels)} channels")

        # Check if messages were found
        if not all_messages:
            raise ValueError("No messages were found in any channels")

        return all_messages

    except Exception as e:
        logger.error(f"Error fetching messages for user: {str(e)}")
        raise


async def fetch_channel_messages(
        client: AsyncWebClient,
        channel_id: str,
        channel_name: str,
        oldest_timestamp: str
) -> List[Dict]:
    """Fetch all messages from a single channel with pagination handling"""
    messages = []
    cursor = None

    # Semaphore for rate limiting (3 requests per second)
    async with asyncio.Semaphore(3):
        while True:
            try:
                await asyncio.sleep(0.35)  # Rate limit: ~3 requests per second

                response = await client.conversations_history(
                    channel=channel_id,
                    cursor=cursor,
                    oldest=oldest_timestamp,
                    limit=100  # Maximum allowed by Slack API
                )

                if not response['ok']:
                    logger.error(f"Error in channel {channel_name}: {response.get('error')}")
                    break

                # Process messages
                channel_messages = [
                    {
                        'channel_name': channel_name,
                        'user': msg.get('user'),
                        'text': msg.get('text', '').strip(),
                        'timestamp': msg.get('ts'),
                        'thread_ts': msg.get('thread_ts'),
                        'replies_count': msg.get('reply_count', 0)
                    }
                    for msg in response.get('messages', [])
                    if msg.get('text')  # Filter out empty messages
                ]

                messages.extend(channel_messages)

                # Handle pagination
                if response.get('has_more'):
                    cursor = response['response_metadata']['next_cursor']
                else:
                    break

            except Exception as e:
                logger.error(f"Error fetching messages for channel {channel_name}: {str(e)}")
                break

    return messages


async def generate_newsletter_content(slack_token: str, user_timezone, is_for_slack=False) -> Optional[Dict]:
    # Call the slack API to get user data.
    try:
        # logger.info(f"Generating newsletter content. This will take a while...")
        # Get user subscriptions and determine premium status
        # subscriptions = await get_user_subscriptions(user_token.id)
        # is_premium = bool(subscriptions)  # True if any active subscriptions exist
        is_premium = True

        # TODO: add more sophisticated checks if needed.
        # We only allow premium users to get newsletters.
        # if not is_premium:
        #     raise ValueError('Not Subscribed to any premium plans')

        summary_content = await generate_slack_summary(slack_token, is_for_slack)

        # Set subject line
        subject_line = "Your Daily News Summary"

        # Handle differently based on destination
        if is_for_slack:
            # For Slack, just return the plain text content without HTML
            return {
                "subject": subject_line,
                "body": summary_content  # Return the raw summary content directly
            }
        else:
            # For email, use the HTML template
            template_dir = Path(__file__).parent.parent.parent.parent / 'templates'
            template_env = jinja2.Environment(
                loader=jinja2.FileSystemLoader(template_dir),
                autoescape=True
            )
            template = template_env.get_template('newsletter.html')

            user_tz = pytz.timezone(user_timezone)
            now = datetime.now().astimezone(user_tz)
            day_of_week = now.strftime("%A")
            date = f"{now.strftime('%b')} {p.ordinal(now.day)}"

            # Render the newsletter template
            newsletter_content = template.render(
                summary=summary_content,
                logo_data=settings.LOGO_URL,
                app_url=settings.APP_URL,
                day_of_week=day_of_week,
                date=date,
                is_premium=is_premium
            )

            return {
                "subject": subject_line,
                "body": newsletter_content
            }
    except Exception as e:
        logger.error(f"Error generating newsletter content: {str(e)}")
        raise e
