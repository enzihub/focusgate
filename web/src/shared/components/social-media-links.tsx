export default function SocialMediaLinks() {
  return (
    <div>
      <div className='flex gap-6'>
        <div>
          <a href='#'>
            <svg
              className='h-8 w-8 transform stroke-gray-800 transition-transform hover:scale-110 hover:stroke-blue-500'
              viewBox='0 0 192 192'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
            >
              <path
                strokeLinejoin='round'
                strokeWidth='10'
                d='M126 38c-14.359 0-26 11.64-26 26a25.89 25.89 0 0 0 2.929 12C72 76 56 70 30 46c0 39.5 10 66 34 81-8 11.2-29.333 14.333-42 14.5 0 0 14 13.5 46 13.5 56 0 84-46.783 84-91l18-20h-27.386A25.892 25.892 0 0 0 126 38Z'
              />
            </svg>
          </a>
        </div>
        <div>
          <a href='#'>
            <svg
              className='h-8 w-8 transform fill-gray-800 transition-transform hover:scale-110 hover:fill-red-500'
              viewBox='-143 145 512 512'
              xmlns='http://www.w3.org/2000/svg'
            >
              <g>
                <path d='M329,145h-432c-22.1,0-40,17.9-40,40v432c0,22.1,17.9,40,40,40h432c22.1,0,40-17.9,40-40V185C369,162.9,351.1,145,329,145z M339,617c0,5.5-4.5,10-10,10h-432c-5.5,0-10-4.5-10-10V185c0-5.5,4.5-10,10-10h432c5.5,0,10,4.5,10,10V617z' />
                <rect x='-8.5' y='348.4' width='40.9' height='159.7' />
                <path d='M177.7,346.9c-28.6,0-46.5,15.6-49.8,26.6v-25.1H71.8c0.7,13.3,0,159.7,0,159.7h56.1v-86.3c0-4.9-0.2-9.7,1.2-13.1 c3.8-9.6,12.1-19.6,27-19.6c19.5,0,28.3,14.8,28.3,36.4v82.6H241v-88.8C241,369.9,213.2,346.9,177.7,346.9z' />
                <path
                  strokeWidth='2'
                  d='M15.4,273c-18.4,0-30.5,11.9-30.5,27.7c0,15.5,11.7,27.7,29.8,27.7h0.4c18.8,0,30.5-12.3,30.4-27.7 C45.1,284.9,33.8,273,15.4,273z'
                />
              </g>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
