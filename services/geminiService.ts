import { GoogleGenAI, Type, Schema } from "@google/genai";

// --- Provider Management ---
export type AIProvider = 'gemini' | 'deepseek';

export const getAIConfig = () => {
  const provider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
  const geminiKey = localStorage.getItem('gemini_key') || '';
  const deepseekKey = localStorage.getItem('deepseek_key') || '';
  return { provider, geminiKey, deepseekKey };
};

// Helper to get client instance based on config
const getClient = () => {
  const { provider, geminiKey, deepseekKey } = getAIConfig();
  
  if (provider === 'gemini') {
    if (!geminiKey) throw new Error("请在设置中配置 Gemini API Key");
    return new GoogleGenAI({ apiKey: geminiKey });
  } else {
    // Basic DeepSeek Implementation (Mocked via GoogleGenAI interface for structure, 
    // in real-world this would need a custom fetch implementation for OpenAI-compatible endpoints)
    // For this demo, we enforce Gemini if DeepSeek key is missing, or alert user.
    if (!deepseekKey) throw new Error("请在设置中配置 DeepSeek API Key");
    // NOTE: This library (@google/genai) is strictly for Google models.
    // For DeepSeek, you would typically use `openai` package or `fetch`.
    // To keep this app simple and working with the current architecture, 
    // we will throw an error if user tries to use DeepSeek without implementing the fetch logic.
    throw new Error("DeepSeek 模式暂未完全集成，请切换回 Gemini 使用 Google 的免费/付费模型。");
  }
};

const MODEL_NAME = "gemini-2.5-flash"; // Fast and capable

// --- API Functions ---

export const generateDailyLesson = async (phase: string, masteredWords: string[]) => {
  const ai = getClient();
  const prompt = `你是 CATTI 翻译考试专家。请为"${phase}"的学生生成今日学习内容。
  学生已掌握这些词，请避开：${masteredWords.slice(0, 50).join(', ')}...
  
  请返回 JSON 格式，包含：
  1. readingArticle: 一篇200词左右的 ${phase} 难度新闻或社论 (title, source, content)。
  2. vocabulary: 5个来源于文章的高级词汇 (word, meaning, usage)。
  3. grammarPoint: 一个翻译语法点 (topic, explanation, explanationCn, example, exampleCn)。
  4. comprehensiveExercises: 3道综合题，类型可以是单选(vocabulary_replacement/cloze)或改错(error_correction)。如果是单选，options字段是必须的。
  5. exercise: 一道翻译实务题 (type: "英译汉" or "中译英", question)。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      readingArticle: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          source: { type: Type.STRING },
          content: { type: Type.STRING },
        }
      },
      vocabulary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            meaning: { type: Type.STRING },
            usage: { type: Type.STRING },
          }
        }
      },
      grammarPoint: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          explanation: { type: Type.STRING },
          explanationCn: { type: Type.STRING },
          example: { type: Type.STRING },
          exampleCn: { type: Type.STRING },
        }
      },
      comprehensiveExercises: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['vocabulary_replacement', 'fill_in_blanks', 'error_correction', 'cloze'] },
            typeLabel: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING },
          }
        }
      },
      exercise: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          question: { type: Type.STRING },
        }
      }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzeReadingArticle = async (title: string, content: string) => {
  const ai = getClient();
  const prompt = `分析这篇 CATTI 阅读材料：
  Title: ${title}
  Content: ${content}
  
  提供 JSON 输出：
  1. structures: 3个长难句分析 (original, analysis)。
  2. techniques: 3个翻译技巧 (strings)。
  3. referenceTranslation: 全文中文参考译文。
  4. grammarFocus: 核心语法总结。`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      structures: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            analysis: { type: Type.STRING }
          }
        }
      },
      techniques: { type: Type.ARRAY, items: { type: Type.STRING } },
      referenceTranslation: { type: Type.STRING },
      grammarFocus: { type: Type.STRING }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};

export const reviewTranslation = async (source: string, userTranslation: string) => {
  const ai = getClient();
  const prompt = `作为 CATTI 阅卷专家，请点评学生的翻译：
  原文: ${source}
  学生译文: ${userTranslation}
  
  返回 JSON:
  1. original (string)
  2. translation (string)
  3. critique: 详细点评 (string)
  4. improvedVersion: 专家参考译文 (string)
  5. cattiTips: 3个针对性的 CATTI 备考建议 (array of strings)`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      original: { type: Type.STRING },
      translation: { type: Type.STRING },
      critique: { type: Type.STRING },
      improvedVersion: { type: Type.STRING },
      cattiTips: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateTranslationChallenge = async (phase: string) => {
  const ai = getClient();
  const prompt = `生成一个 ${phase} 难度的 CATTI 翻译练习句。
  返回 JSON:
  1. source: 原文句子 (string)
  2. context: 语境/来源 (string, e.g. "政府白皮书", "纽约时报")
  3. difficulty: 难度描述 (string)
  4. type: "C-E" (中译英) 或 "E-C" (英译汉)`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING },
      context: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['C-E', 'E-C'] }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateVocabChallenge = async (word: string, mode: string) => {
  const ai = getClient();
  const prompt = `针对单词 "${word}" 生成一个 "${mode}" 模式的测试题。
  如果 mode 是 'economist'，生成一个来自经济学人的填空题。
  如果 mode 是 'synonym'，生成一个近义词辨析题。
  返回 JSON:
  1. content: 题干内容 (string)
  2. options: 4个选项 (array of strings)
  3. answer: 正确选项 (string)`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      answer: { type: Type.STRING }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getGeminiResponse = async (input: string) => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `You are a professional CATTI tutor. Answer the student's question concisely and helpfully: ${input}`,
  });
  return response.text;
};

export const generateWeeklyTest = async () => {
  const ai = getClient();
  const prompt = `生成一套 CATTI 二级模拟测试卷 (JSON)。
  包含：
  1. vocabulary: 10道词汇选择题 (id, question, options[4])。
  2. cloze: 一篇短文完形填空 (text, items[{id, options[4]}] )。
  3. reading: 一篇阅读理解 (article, questions[{id, question, options[4]}] )。
  4. translationEC: 一段英译汉原文 (source)。
  5. translationCE: 一段中译英原文 (source)。`;

  // Complex schema omitted for brevity, using partial schema for key structures
  // Ideally, full schema definition ensures strict adherence.
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      vocabulary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      cloze: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          items: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 id: { type: Type.STRING },
                 options: { type: Type.ARRAY, items: { type: Type.STRING } }
               }
             }
          }
        }
      },
      reading: {
        type: Type.OBJECT,
        properties: {
          article: { type: Type.STRING },
          questions: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 id: { type: Type.STRING },
                 question: { type: Type.STRING },
                 options: { type: Type.ARRAY, items: { type: Type.STRING } }
               }
             }
          }
        }
      },
      translationEC: { type: Type.OBJECT, properties: { source: { type: Type.STRING } } },
      translationCE: { type: Type.OBJECT, properties: { source: { type: Type.STRING } } }
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // Use flash for larger context generation speed
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};

export const evaluateWeeklyTest = async (testPaper: any, userAnswers: any) => {
  const ai = getClient();
  const prompt = `批改这份 CATTI 模拟卷。
  试卷内容: ${JSON.stringify(testPaper).substring(0, 5000)}...
  用户答案: ${JSON.stringify(userAnswers)}
  
  返回 JSON:
  1. score: 总分 0-100 (number)
  2. generalFeedback: 整体评价 (string)
  3. sections: 数组, 包含各个部分的评分详情 (title, score, correctAnswers, critique)。`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      generalFeedback: { type: Type.STRING },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            score: { type: Type.NUMBER },
            correctAnswers: { type: Type.STRING },
            critique: { type: Type.STRING }
          }
        }
      }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateCollocations = async (theme: string) => {
  const ai = getClient();
  const prompt = `生成 5 个关于 "${theme}" 主题的高级英语固定搭配 (CATTI 级别)。
  返回 JSON:
  collocations: 数组 [{ phrase, meaning, example }]`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      collocations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phrase: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example: { type: Type.STRING }
          }
        }
      }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "{}");
};