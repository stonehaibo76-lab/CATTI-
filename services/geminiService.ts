
import { GoogleGenAI, Type } from "@google/genai";

// --- Provider Management ---
export type AIProvider = 'gemini' | 'deepseek';

export const getAIConfig = () => {
  const provider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
  const deepseekKey = localStorage.getItem('deepseek_key') || '';
  return { provider, deepseekKey };
};

// --- DeepSeek Helper ---
const callDeepSeek = async (
  messages: { role: string; content: string }[], 
  responseSchema?: any,
  jsonMode: boolean = false
) => {
  const { deepseekKey } = getAIConfig();
  if (!deepseekKey) throw new Error("DeepSeek API Key is missing.");

  // If there's a schema, append it to the system prompt to guide DeepSeek
  let finalMessages = [...messages];
  if (jsonMode && responseSchema) {
    const schemaDesc = JSON.stringify(responseSchema, null, 2);
    const systemMsgIndex = finalMessages.findIndex(m => m.role === 'system');
    const instruction = `\n\nIMPORTANT: You must output strict JSON matching this schema:\n${schemaDesc}`;
    
    if (systemMsgIndex >= 0) {
      finalMessages[systemMsgIndex].content += instruction;
    } else {
      finalMessages.unshift({ role: 'system', content: instruction });
    }
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: finalMessages,
      response_format: jsonMode ? { type: 'json_object' } : { type: 'text' },
      temperature: 1.3 // DeepSeek V3 tends to be better with slightly higher temp for creativity
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'DeepSeek API Error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// --- Unified API Functions ---

export const getGeminiResponse = async (prompt: string, systemInstruction?: string) => {
  const { provider } = getAIConfig();

  if (provider === 'deepseek') {
    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });
    return await callDeepSeek(messages);
  }

  // Fallback to Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || "你是一位精通 CATTI 二级翻译和 C1-C2 级别的高级英语老师。请用中文回答用户的问题，并提供专业的英语学习建议。",
      temperature: 0.7,
    }
  });
  return response.text;
};

export const generateVocabChallenge = async (word: string, mode: 'economist' | 'synonym') => {
  const { provider } = getAIConfig();
  const promptText = mode === 'economist' 
    ? `请为单词 "${word}" 生成一段模仿《The Economist》文风的短评。要求：1. 句子地道复杂。2. 将 "${word}" 替换为 "_____"。3. 提供中文大意。`
    : `请为单词 "${word}" 提供 3 个高阶近义词，并设计一道辨析题。要求：1. 题干含空位。2. 选项含 "${word}" 及3个近义词。3. 提供答案和CATTI级辨析。`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "挖空句子或题干" },
      translation: { type: Type.STRING, description: "中文释义或大意" },
      options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "仅限 synonym 模式" },
      answer: { type: Type.STRING },
      analysis: { type: Type.STRING, description: "深度辨析说明" }
    },
    required: ["content", "translation", "answer"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "你是一位 CATTI 词汇专家。" }, { role: 'user', content: promptText }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: promptText,
    config: {
      systemInstruction: "你是一位 CATTI 词汇专家。请仅返回 JSON 格式数据。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateTranslationChallenge = async (phase: string) => {
  const { provider } = getAIConfig();
  const isCE = Math.random() > 0.5; 
  const contents = isCE 
    ? `请为正处于 ${phase} 阶段的 CATTI 二级考生生成一句具有挑战性的【中译英】练习原文。`
    : `请为正处于 ${phase} 阶段的 CATTI 二级考生生成一句具有挑战性的【英译汉】练习原文。`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING },
      context: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      type: { type: Type.STRING }
    },
    required: ["source", "context", "difficulty", "type"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "你是一位 CATTI 资深命题导师。" }, { role: 'user', content: contents }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: "你是一位 CATTI 资深命题导师。请仅返回 JSON 格式数据。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateWeeklyTest = async (level: string = "CATTI 2") => {
  const { provider } = getAIConfig();
  const prompt = `请为 ${level} 考生生成一套周测卷。`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      testId: { type: Type.STRING },
      vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
      cloze: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.NUMBER }, options: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } },
      reading: { type: Type.OBJECT, properties: { article: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.NUMBER }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } },
      translationEC: { type: Type.OBJECT, properties: { source: { type: Type.STRING } } },
      translationCE: { type: Type.OBJECT, properties: { source: { type: Type.STRING } } }
    },
    required: ["testId", "vocabulary", "cloze", "reading", "translationEC", "translationCE"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "你是一位 CATTI 命题组专家。" }, { role: 'user', content: prompt }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "你是一位 CATTI 命题组专家。请仅返回 JSON 格式数据。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};

export const evaluateWeeklyTest = async (testPaper: any, userAnswers: any) => {
  const { provider } = getAIConfig();
  const prompt = `试卷：${JSON.stringify(testPaper)}\n用户答案：${JSON.stringify(userAnswers)}`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      generalFeedback: { type: Type.STRING },
      sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, score: { type: Type.NUMBER }, correctAnswers: { type: Type.STRING }, critique: { type: Type.STRING } } } }
    },
    required: ["score", "generalFeedback", "sections"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "你是一位资深的 CATTI 阅卷组组长。" }, { role: 'user', content: prompt }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "你是一位资深的 CATTI 阅卷组组长。请给出总分、各部分得分、标准答案及解析。返回 JSON。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateDailyLesson = async (phase: string, masteredWords: string[] = []) => {
  const { provider } = getAIConfig();
  const prompt = `请为正处于 ${phase} 阶段的 CATTI 二级考生生成今日学习任务。
  
  【重点调整指令：加大"笔译综合"比重，阅读精简，实务练习纯粹化】：
  1. **Comprehensive Exercises (综合练习) 专项要求**：
     - 请生成 **8-10 道** 高质量的选择题。
     - **核心来源**：题目必须 **源自或高度模仿 CATTI 二级笔译综合能力的历年真题** (Vocabulary Selection, Error Correction, Cloze segments)。
     - **题型分布**：
       - 60% 词汇同义替换与辨析 (Vocabulary Selection / Synonyms) - 模仿真题风格。
       - 30% 语法纠错与结构 (Grammar / Error Correction) - **注意：这是选择题形式的改错**。
       - 10% 完形填空片段 (Cloze)。
  
  2. **Reading Article (文章精读) 强制要求**：
     - **字数限制**：文章内容 (\`content\`) 必须严格控制在 **150 - 200 单词**之间。
     - **题材**：《经济学人》、《纽约时报》或外刊社论片段。

  3. **Translation Practice (笔译实务练习 - \`exercise\` 字段) 核心要求**：
     - **内容**：必须是一段 **待翻译的原文（中文或英文）**，用于 CATTI 笔译实务模拟。
     - **形式**：短句或句段（Sentence or Paragraph segment）。
     - **严禁**：**绝对不要**在此字段生成“改错题 (Error Correction)”、“选择题”或“语法分析”。只提供纯文本原文。
     - **Type**：标注为 "中译英 (C-E)" 或 "英译汉 (E-C)"。

  4. **通用格式要求**：
     - 如果题目是选择题，**必须**在 \`options\` 数组中提供 4 个具体的干扰项。
     - **严禁**包含 "A.", "B." 等前缀。
     - \`answer\` 字段**必须**包含正确答案的完整文本。
     - \`explanation\` 必须提供详细的中文解析。`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      readingArticle: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, source: { type: Type.STRING }, content: { type: Type.STRING } } },
      vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, meaning: { type: Type.STRING }, usage: { type: Type.STRING } } } },
      comprehensiveExercises: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT, 
          properties: { 
            type: { type: Type.STRING }, 
            typeLabel: { type: Type.STRING }, 
            question: { type: Type.STRING }, 
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required for multiple choice questions. Must have 4 options. NO Prefixes like 'A.'." }, 
            answer: { type: Type.STRING, description: "Must not be empty. The correct option text." }, 
            explanation: { type: Type.STRING } 
          },
          required: ["type", "typeLabel", "question", "answer", "explanation"]
        } 
      },
      grammarPoint: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, explanation: { type: Type.STRING }, explanationCn: { type: Type.STRING }, example: { type: Type.STRING }, exampleCn: { type: Type.STRING } } },
      exercise: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, type: { type: Type.STRING } } }
    },
    required: ["readingArticle", "vocabulary", "comprehensiveExercises", "grammarPoint", "exercise"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "你是一位资深的 CATTI 笔译培训导师。请侧重于综合能力真题训练。" }, { role: 'user', content: prompt }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "你是一位资深的 CATTI 笔译培训导师。请严格按照 JSON 格式返回。重点：增加历年真题比例，减少阅读题，确保所有选择题都有 options 和 answer。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeReadingArticle = async (title: string, content: string) => {
  const { provider } = getAIConfig();
  const prompt = `深度翻译详解：${title}\n内容：${content.substring(0, 3000)}`; // Truncate if too long

  const schema = {
    type: Type.OBJECT,
    properties: {
      structures: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, analysis: { type: Type.STRING } } } },
      techniques: { type: Type.ARRAY, items: { type: Type.STRING } },
      referenceTranslation: { type: Type.STRING },
      grammarFocus: { type: Type.STRING }
    },
    required: ["structures", "techniques", "referenceTranslation", "grammarFocus"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "你是一位资深的 CATTI 二级笔译导师。" }, { role: 'user', content: prompt }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "你是一位资深的 CATTI 二级笔译导师。返回格式必须是 JSON。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};

export const reviewTranslation = async (original: string, userTranslation: string) => {
  const { provider } = getAIConfig();
  const prompt = `原文：${original}\n我的：${userTranslation}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      critique: { type: Type.STRING },
      improvedVersion: { type: Type.STRING },
      cattiTips: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["critique", "improvedVersion", "cattiTips"]
  };

  if (provider === 'deepseek') {
    const res = await callDeepSeek(
      [{ role: 'system', content: "CATTI 老师点评。" }, { role: 'user', content: prompt }],
      schema,
      true
    );
    return JSON.parse(res);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "CATTI 老师点评。返回格式为 JSON。",
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || "{}");
};
