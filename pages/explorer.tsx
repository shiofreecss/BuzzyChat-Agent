import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import the component dynamically with SSR disabled
// This prevents hydration errors with Three.js and browser APIs
const ExplorerBeaverAgent = dynamic(
  () => import('../components/ExplorerBeaverAgent'),
  { ssr: false }
);

const ExplorerPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Explorer Buzzy - 3D Safari Beaver Agent</title>
        <meta name="description" content="3D safari explorer beaver agent with voice interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
          Back to Human Agent
        </Link>
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <Link href="/beaver" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-colors">
          Try Regular Beaver
        </Link>
      </div>

      <main>
        <ExplorerBeaverAgent />
      </main>
    </div>
  );
};

export default ExplorerPage; 