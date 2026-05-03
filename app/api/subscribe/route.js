export async function POST(request) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const AUDIENCE_ID = "6dfd4b6f32";
  const SERVER = "us2";

  const res = await fetch(
    `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${API_KEY}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
      }),
    }
  );

  const data = await res.json();

  if (res.ok) {
    return Response.json({ success: true });
  }

  // Mailchimp returns 400 with title "Member Exists" for already-subscribed emails
  if (data.title === "Member Exists") {
    return Response.json({ error: "You're already subscribed!" }, { status: 400 });
  }

  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
