export async function fetchAIComment(character, postTitle, postContent) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // 또는 gpt-4.1-mini
      messages: [
        {
          role: "system",
          content: `
          ${character.name} - ${character.prompt_description}
          Must Remain fully immersed in your persona.
          Must Reply in the user’s language with short 1‑2 witty or encouraging sentences that preserve the character’s unique tone and style.`,
        },
        {
          role: "user",
          content: `Title: ${postTitle}\nContent: ${postContent}`,
        },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API Error:", error); // 에러 메시지 콘솔에 출력
    throw new Error("OpenAI API 호출 실패");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "You're doing great!";
}
