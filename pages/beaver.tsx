import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import the component dynamically with SSR disabled
// This prevents hydration errors with Three.js and browser APIs
const BeaverAgent = dynamic(
  () => import('../components/BeaverAgent'),
  { ssr: false }
);

const BeaverPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Buzzy the Beaver - 3D Talking Agent</title>
        <meta name="description" content="3D talking beaver agent with voice interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
          Back to Human Agent
        </Link>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <Link href="/explorer" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md transition-colors">
          Try Explorer Buzzy!
        </Link>
      </div>

      <main>
        <BeaverAgent />
      </main>
    </div>
  );
};

export default BeaverPage; 