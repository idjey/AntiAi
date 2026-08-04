async function test() {
  console.log("Fetching fake hash from API...");
  const res = await fetch("http://localhost:4000/v1/subjects/fakehash");
  console.log("Status:", res.status);
  console.log("Content-Length:", res.headers.get("content-length"));
  const text = await res.text();
  console.log("Body text:", JSON.stringify(text));
  
  if (text === "") {
    console.log("JSON parsing this will crash: SyntaxError: Unexpected end of JSON input");
  } else {
    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", json);
    } catch (e) {
      console.log("Crash:", e.message);
    }
  }
}
test();
