# T13d - Assinaturas HMAC SHA-256 para Webhooks

## O que este Tijolo Faz
O T13d provê uma chave final na infraestrutura Push da aplicação: a capacidade de prover as ferramentas externas uma garantia matemática (assinatura criptográfica) de que o payload que chegou ao sistema delas de fato foi emitido pela nossa aplicação, e não por um ator malicioso simulando um Body.

### 1 - O Segredo (Signing Secret)
Se configurado via Admin/Banco o `signing_mode='hmac_sha256'`, a aplicação lerá do registro a coluna `signing_secret`.

### 2 - A Assinatura (String to Sign)
Para prover proteção de Replay (onde o Request é copiado inteiro na rede), o sistema usa o padrão Stripe de concaternar um Timestamp. 
String base: `<timestamp_unix>.<rawPayloadJson>`
A assinatura resultante entra em Hex (com prefixo `v1=`).

### Headers Embutidos no Delivery
Quando ativo, estes 3 headers acompanharão o POST Request:
- `x-webhook-timestamp`: contendo os segundos em UNIX.
- `x-webhook-signature`: `v1=1a2b3c4d5e...` (O Hash)
- `x-webhook-signature-version`: `v1`
*(Nomes podem ser customizados pela base)*

## Como habilitar no Banco (Não exposto na UI pública por segurança)
Rode no Editor SQL do console Supabase:
```sql
UPDATE alert_webhook_destinations 
SET signing_mode = 'hmac_sha256', signing_secret = 'seu_super_segredo_gerado_externamente'
WHERE id = 'ID-DO-WEBHOOK';
```
*(Nota: O valor 'signing_kid' também pode ser preenchido caso seja exigido rotação de chaves mapeáveis).*

## Exemplo de Validação no seu Sistema Destino (Pseudo NodeJS)
```js
const crypto = require('crypto');

app.post('/meu-destino', (req, res) => {
    const sigHeaders = req.headers['x-webhook-signature'];
    const tsHeader = req.headers['x-webhook-timestamp'];
    
    // extrai o hash pos v1=
    const parts = sigHeaders.split(',');
    const [, hashValue] = parts[0].split('=');
    
    const secret = "seu_super_segredo_gerado_externamente";
    const sigPayload = `${tsHeader}.${req.rawBody}`; // AVISO: precisa ser a RAW STRING do body JSON

    const expectedSig = crypto.createHmac('sha256', secret).update(sigPayload, 'utf8').digest('hex');

    if (expectedSig !== hashValue) {
        return res.status(401).send("Invalid Signature");
    }
    
    // Aceito!
    res.status(200).send("OK");
});
```

## Limitações Residuais
- Para preservar escopo, o painel Front-End propositalmente NÃO EXIBE formulários para gerar a chave, evintado que Operadores logados possam vazar chaves de integração por engano. Isso é resolvido pelo Sysadmin direto no banco.
- Não dispomos de criptografia assimétrica (RSA/ECC) atualmente.
