function text() {
    return {
        type: "object",
        properties: {
            iso: {
                type: "string"
            },
            content: {
                type: "string"
            }
        },
        required: ["iso", "content"],
        additionalProperties: false
    }
}

/**
* @param {Env} env
* @param {string} from
* @param {string} to
* @param {string} content
*/
function translation(env, from, to, content) {
    return fetch(new URL(env.OPENAI_ENDPOINT), {
        method: "POST",
        headers: {
            "Authorization": "Bearer ".concat(env.OPENAI_API_KEY),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    "role": "system",
                    "content": "You are an expert in " + from + "-" + to + " translations. Translate the content of user messages into " + to
                },
                {
                    "role": "user",
                    content
                }
            ],
            response_format: {
                "type": "json_schema",
                "json_schema": {
                    "name": "text_translation",
                    "schema": {
                        "type": "object",
                        "properties": {
                            text: text(),
                            translation: text()
                        },
                        additionalProperties: false,
                        required: ["text", "translation"]
                    },
                    "strict": true
                }
            }
        })
    })
}

/**
 * @type ExportedHandler<Env>
 */
export default {
    async fetch(request, env) {
        const { from = "en", to = "es", text = "Welcome to the Siguiente translation API." } = await request.json()

        const response = await translation(env, from, to, text)
            .then((res) => res.json())
            .then((res) => res.choices.at(0).message.content)
            .then(JSON.parse)
            .then(Response.json)
            .catch((error) => new Response(JSON.stringify({ error }), { status: 400 }))

        return response
    }
};