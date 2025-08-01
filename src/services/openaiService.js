export async function fetchAIComment(
  character,
  postContent,
  hashtags = [],
  mood = null
) {
  const cleanContent = postContent
    .replace(/<\/?(p|div|h[1-6]|li|br)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 해시태그를 문자열로 변환
  const hashtagsText =
    hashtags.length > 0
      ? `Hashtags: ${hashtags.map((tag) => `#${tag}`).join(" ")}`
      : "";

  // mood 정보 추가
  const moodText = mood ? `Mood: ${mood}` : "";

  // 컨텍스트 정보 조합
  const contextInfo = [hashtagsText, moodText].filter(Boolean).join("\n");

  // 시스템 프롬프트 동적 구성
  const systemPrompt = `${character.name} - ${
    character.prompt_description
  }\nStay fully immersed in this persona at all times.\nRespond in the user's language.\nUse short 1-2 witty sentences that preserve your unique style and divine tone.${
    contextInfo
      ? "\nConsider the post's mood and hashtags to understand the emotional context."
      : ""
  }`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Content: ${cleanContent}${
            contextInfo ? "\n" + contextInfo : ""
          }`,
        },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API Error:", error);
    throw new Error("OpenAI API 호출 실패");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "You're doing great!";
}
