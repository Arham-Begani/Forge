import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function inspectChunk() {
    const modelId = 'gemini-3-pro-preview'
    console.log(`Inspecting ${modelId} with thinkingConfig...`)
    const model = genAI.getGenerativeModel({
        model: modelId,
        generationConfig: {
            // @ts-ignore
            thinkingConfig: { includeThoughts: true, thinkingBudget: 10000 },
        },
    })

    try {
        const result = await model.generateContentStream('Think about a complex problem, then give a JSON { "result": "ok" }')
        for await (const chunk of result.stream) {
            console.log('--- CHUNK ---')
            // @ts-ignore
            const candidate = chunk.candidates?.[0]
            if (candidate) {
                console.log('Keys in candidate:', Object.keys(candidate))
                // @ts-ignore
                if (candidate.content?.parts) {
                    console.log('Parts types:', candidate.content.parts.map((p: any) => Object.keys(p)))
                }
            }
            try {
                const text = chunk.text()
                console.log('text():', text.slice(0, 50))
            } catch (e: any) {
                console.log('text() FAILED:', e.message)
            }
        }
    } catch (e: any) {
        console.error('Stream failed:', e.message)
    }
}

inspectChunk()
