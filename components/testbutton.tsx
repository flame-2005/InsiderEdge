"use client"

export default function TestCronButton() {

  const triggerCron = async () => {
    const res = await fetch("/api/cron/bse-scraper", {
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`
      }
    });
    const data = await res.json();
    console.log(data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <button onClick={triggerCron} className="px-4 py-2 bg-green-600 text-white rounded">
      Test BSE Cron (Manual Trigger)
    </button>
  );
}