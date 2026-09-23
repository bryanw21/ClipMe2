"use client";
/* eslint-disable react-hooks/set-state-in-effect -- this page loads an authenticated account list after session hydration. */

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FiCheckCircle, FiExternalLink, FiRefreshCw, FiShield } from "react-icons/fi";

const platforms = [
  {
    id: "youtube",
    name: "YouTube",
    description: "Connect your channel to bring in authorized originals and publish Shorts.",
    icon: FaYoutube,
    color: "text-red-400",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Publish finished clips as Reels to your connected Professional account.",
    icon: FaInstagram,
    color: "text-pink-400",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Publish finished clips as Reels to your connected Facebook Page.",
    icon: FaFacebookF,
    color: "text-blue-400",
  },
];

export default function ConnectionsPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAccounts(showLoading = false) {
    if (!session?.user) return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/connections");
      const data = await response.json();
      setAccounts(data.accounts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAccounts(); }, [session?.user]);

  if (status === "loading") return null;
  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6 py-16">
        <section className="glass-panel w-full rounded-3xl border border-divider p-10 text-center">
          <h1 className="text-3xl font-black">Connect your creator accounts</h1>
          <p className="mx-auto mt-3 max-w-lg text-secondary-text">Sign in first, then ClipMee can connect the channels and Pages you control.</p>
          <button onClick={() => signIn()} className="mt-7 rounded-full bg-primary px-6 py-3 font-bold text-white">Sign in to ClipMee</button>
        </section>
      </main>
    );
  }

  const isConnected = (platform) => accounts.some((account) => account.provider === platform);
  const connect = (platform) => {
    if (platform === "youtube") signIn("google", { callbackUrl: "/connections" });
    else window.location.assign("/api/connections/meta");
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">ClipMee Connections</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your channels. One clip workflow.</h1>
          <p className="mt-3 max-w-2xl text-secondary-text">Connect only accounts you manage. ClipMee turns authorized originals into short-form clips and prepares them for publishing.</p>
        </div>
        <button onClick={() => loadAccounts(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-divider px-4 py-2 text-sm font-bold text-secondary-text hover:text-primary-text">
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const connected = isConnected(platform.id);
          const account = accounts.find((item) => item.provider === platform.id);
          return (
            <section key={platform.id} className="glass-panel flex min-h-72 flex-col rounded-3xl border border-divider p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-page ${platform.color}`}><Icon size={24} /></div>
                {connected && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300"><FiCheckCircle /> Connected</span>}
              </div>
              <h2 className="mt-6 text-xl font-black">{platform.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-secondary-text">{platform.description}</p>
              {connected && <p className="mt-5 truncate text-sm font-semibold text-primary-text">{account?.displayName}</p>}
              <button onClick={() => connect(platform.id)} className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold transition ${connected ? "border border-divider text-primary-text hover:bg-bg-page" : "bg-primary text-white hover:bg-primary-hover"}`}>
                {connected ? "Reconnect account" : `Connect ${platform.name}`}
              </button>
            </section>
          );
        })}
      </div>

      <section className="mt-8 flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-secondary-text">
        <FiShield className="mt-0.5 shrink-0 text-primary" size={19} />
        <p><strong className="text-primary-text">Your account stays in your control.</strong> ClipMee stores connection tokens encrypted and uses official Google and Meta authorization. Instagram publishing requires a Professional account linked to a Facebook Page.</p>
      </section>
      <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" href="/">Open ClipMee Studio <FiExternalLink /></Link>
    </main>
  );
}
