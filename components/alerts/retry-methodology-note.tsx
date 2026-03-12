export function RetryMethodologyNote() {
    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <span className="text-amber-500">⚠️</span>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                        Sobre Retry e Backoff (T13c)
                    </h3>
                    <div className="mt-2 text-sm text-amber-700 space-y-2">
                        <p>
                            O sistema difere falhas <strong>Permanentes</strong> (ex: 400 Bad Request, 401 Unauthorized, 403, 404) de falhas <strong>Retentáveis</strong> (ex: 500 Internas, Network Timeout).
                        </p>
                        <p>
                            Falhas retentáveis são empilhadas numa cadência espaçada (ex: 5min, 30min, 6h). O próprio Cron Job de entrega padrão tentará resolvê-las automaticamente no momento certo.
                        </p>
                        <p>
                            Aqui no Admin, você pode <strong>Forçar a Execução</strong> de retries manuais a qualquer momento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
