import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import the component dynamically with SSR disabled
// This prevents hydration errors with Three.js and browser APIs
const TalkingHeadAgent = dynamic(
  () => import('../components/TalkingHeadAgent'),
  { ssr: false }
);

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>BuzzyChat 3D Talking Agent</title>
        <meta name="description" content="3D talking head agent with voice interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Temporarily hidden beaver buttons
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <Link href="/beaver" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-colors">
          Try Buzzy the Beaver!
        </Link>
        <Link href="/explorer" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md transition-colors">
          Try Explorer Buzzy!
        </Link>
      </div>
      */}

      <main>
        <TalkingHeadAgent />
      </main>
    </div>
  );
};

export default Home; 