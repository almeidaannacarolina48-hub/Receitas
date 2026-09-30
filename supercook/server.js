require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

// Exibe os arquivos do site
app.use(express.static(__dirname));

// Cliente da OpenAI.
// A chave fica somente no servidor.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Endpoint para criar receitas
app.post("/api/sugerir-receitas", async (req, res) => {

    try {

        const ingredientes = req.body.ingredientes;

        if (
            !Array.isArray(ingredientes) ||
            ingredientes.length === 0
        ) {
            return res.status(400).json({
                erro: "Informe pelo menos um ingrediente."
            });
        }

        const listaIngredientes = ingredientes
            .filter(item => typeof item === "string")
            .map(item => item.trim())
            .filter(Boolean)
            .slice(0, 30);

        if (listaIngredientes.length === 0) {
            return res.status(400).json({
                erro: "Não foram encontrados ingredientes válidos."
            });
        }

        const resposta = await openai.responses.create({

            model: "gpt-4.1-mini",

            instructions: `
                Você é um assistente culinário do Reaproveita.
                Responda sempre em português brasileiro.
                Sugira receitas caseiras usando prioritariamente
                os ingredientes informados pelo usuário.
                Não invente que ingredientes foram informados.
                Pode indicar ingredientes extras, identificando-os
                claramente como opcionais.
                Dê instruções claras e práticas.
                Retorne somente JSON válido no formato solicitado.
            `,

            input: `
                Crie 3 receitas usando estes alimentos:
                ${listaIngredientes.join(", ")}

                Retorne um JSON com a propriedade "sugestoes".
                Cada receita deve conter:
                - "nome": nome da receita
                - "descricao": breve descrição
                - "ingredientes": lista de ingredientes e quantidades
                - "preparo": lista de etapas de preparo

                Formato:
                {
                  "sugestoes": [
                    {
                      "nome": "Nome",
                      "descricao": "Descrição",
                      "ingredientes": ["ingrediente e quantidade"],
                      "preparo": ["etapa 1", "etapa 2"]
                    }
                  ]
                }
            `,

            text: {
                format: {
                    type: "json_object"
                }
            }
        });

        const dados = JSON.parse(
            resposta.output_text
        );

        res.json(dados);

    } catch (erro) {

        console.error("Erro na OpenAI:", erro.message);

        res.status(500).json({
            erro: "Não foi possível gerar receitas. Confira a configuração do servidor."
        });

    }

});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Reaproveita rodando em http://localhost:${PORT}`);
});