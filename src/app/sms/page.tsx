import Link from "next/link";
import { requirePageAuth } from "@/lib/page-auth";
import { listSmsMessages } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SmsPage() {
  await requirePageAuth();
  const messages = listSmsMessages(100);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold">短信收件箱 · +1 771 247 2692</h1>
      <p className="mt-1 text-sm text-[#6b7280]">
        Telnyx webhook 收到的短信，仅显示最近 100 条。Trial 下只收验证号发来的短信。刷新页面看新短信。
      </p>
      <p className="mt-3 text-sm">
        <Link className="underline" href="/sms">
          刷新
        </Link>
        <span className="mx-2 text-[#d1d5db]">|</span>
        <Link className="underline" href="/">
          回优惠板
        </Link>
      </p>
      {messages.length === 0 ? (
        <p className="mt-8 rounded-lg border bg-white p-4 text-sm">
          还没有收到短信。从验证号 +1 978-415-9358 回一条短信到这个 Telnyx 号，就能在这里看到。
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-[#6b7280]">
                <span>
                  {m.fromNumber} → {m.toNumber} · {m.type}
                </span>
                <span>
                  {new Date(m.receivedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
