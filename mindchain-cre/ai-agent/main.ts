import { HTTPCapability, handler, type Runtime, type HTTPPayload, Runner } from "@chainlink/cre-sdk"

type Config = {
    geminiApiKey: string
    sepoliaRpc: string
    agentRegistryAddress: string
}

type RequestData = {
    query?: string
    userAddress: string
    action: string
}

const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): Record<string, any> => {
    try {
        const requestData = JSON.parse(payload.input) as RequestData

        runtime.log(`🤖 MindChain CRE Workflow started`)
        runtime.log(`Action: ${requestData.action}`)
        runtime.log(`User: ${requestData.userAddress}`)

        // Simple response for now
        const response = {
            status: "success",
            action: requestData.action,
            message: `Processed ${requestData.action} for ${requestData.userAddress}`,
            timestamp: new Date().toISOString()
        }

        runtime.log(`✅ Response: ${JSON.stringify(response)}`)

        return response
    } catch (error) {
        runtime.log(`❌ Error: ${error}`)
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error"
        }
    }
}

const initWorkflow = (config: Config) => {
    const http = new HTTPCapability()

    return [
        handler(http.trigger({}), onHttpTrigger)
    ]
}

export async function main() {
    const runner = await Runner.newRunner<Config>()
    await runner.run(initWorkflow)
}
