export function WebhookMethodologyNote() {
    return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                        Sobre Entregas de Webhook (T13b)
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 space-y-2">
                        <p>
                            A <strong>Entrega de Webhooks</strong> permite a emissão de anomalias detectadas no território para sistemas externos de forma assíncrona.
                        </p>
                        <p>
                            O sistema usa uma regra simples de *desduplicação (dedupe)* para evitar saturação (spam): O mesmo alerta pendente não será notificado múltiplas vezes com sucesso para o mesmo destino.
                        </p>
                        <p>
                            Isso é uma ferramenta operacional para <strong>otimização do foco da equipe de campo</strong>. Retries robustos ou backoffs exponenciais não estão no escopo base atual (T13b).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

