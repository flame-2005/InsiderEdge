"use client"

export default function TestCronButton() {
  const triggerCron = async () => {
    try {
      // Call a server-side API route that has access to the secret
      const res = await fetch("/api/trigger-cron", {
        method: "POST",
      });
      
      if (!res.ok) {
        const error = await res.text();
        console.error("Cron trigger failed:", error);
        alert(`Error: ${error}`);
        return;
      }
      
      const data = await res.json();
      console.log(data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error triggering cron:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <button 
      onClick={triggerCron} 
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
    >
      Test BSE Cron (Manual Trigger)
    </button>
  );
}