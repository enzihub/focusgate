-- Returns users whose preferred delivery time falls in the next N minutes.
-- Run once against the shared Postgres after the web migrations.
CREATE OR REPLACE FUNCTION get_scheduled_users(lookahead_minutes integer)
RETURNS TABLE (
    clerk_id text,
    user_id uuid,
    email text,
    phone text,
    timezone text,
    scheduled_for timestamptz,
    target_hour integer,
    local_time text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.clerk_id::text,
        u.id::uuid,
        u.email::text,
        up.phone::text,
        up.timezone::text,
        t2.target_utc,
        split_part(up.pref_time, ':', 1)::integer * 100 + 
        split_part(up.pref_time, ':', 2)::integer AS target_hour,
        up.pref_time::text AS local_time
    FROM 
        users u
    JOIN 
        user_prefs up ON u.id = up.user_id
    CROSS JOIN LATERAL (
        SELECT make_time(
            split_part(up.pref_time, ':', 1)::integer,
            split_part(up.pref_time, ':', 2)::integer,
            0
        ) AS target_time
    ) t0
    CROSS JOIN LATERAL (
        SELECT CASE 
            WHEN (NOW() AT TIME ZONE up.timezone)::time < t0.target_time
            THEN (NOW() AT TIME ZONE up.timezone)::date + t0.target_time
            ELSE (NOW() AT TIME ZONE up.timezone)::date + t0.target_time + interval '1 day'
        END AS next_local_time
    ) t1
    CROSS JOIN LATERAL (
        SELECT (t1.next_local_time AT TIME ZONE up.timezone) AS target_utc
    ) t2
    WHERE 
        t2.target_utc BETWEEN NOW() AND NOW() + (lookahead_minutes * interval '1 minute')
        AND up.is_subscribed = TRUE;
END;
$$;
