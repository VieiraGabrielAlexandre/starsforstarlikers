# Como fazer deploy das alterações em JavaScript

Para fazer deploy das alterações em JavaScript que você fizer no site Stars for Starlikers, siga estas instruções simples:

## Método Rápido (Recomendado)

1. Faça suas alterações nos arquivos JavaScript (em `/src/app.js`, `/src/constellation.js`, etc.)
2. No terminal, navegue até o diretório raiz do projeto
3. Execute o script de deploy:

```bash
./aws/deploy.sh
```

4. Quando perguntado, escolha se deseja invalidar o cache do CloudFront para ver as alterações imediatamente

## O que acontece durante o deploy?

Quando você executa o script de deploy:

1. Todos os arquivos do projeto são enviados para o bucket S3 `starsforstarslikers`
2. O CloudFront distribui esses arquivos para os usuários
3. Se você invalidar o cache, as alterações ficam visíveis imediatamente
4. Caso contrário, pode levar até 1 hora para as alterações aparecerem devido ao cache do CloudFront

## Precisa de mais detalhes?

Para instruções mais detalhadas, incluindo o método manual e solução de problemas, consulte:

```
/aws/README.md
```

---

## Alterações feitas para resolver o problema

Para facilitar o deploy das alterações em JavaScript, foram implementadas as seguintes melhorias:

1. Criado um script de deploy automatizado (`/aws/deploy.sh`)
2. Adicionado o ID da distribuição CloudFront como output no Terraform
3. Criada documentação detalhada sobre o processo de deploy
4. Implementado suporte para invalidação de cache do CloudFront
5. Adicionado controle de hash de conteúdo (etag) para detectar alterações em arquivos

Estas alterações permitem que você faça deploy das suas alterações em JavaScript de forma rápida e fácil, sem precisar executar comandos complexos manualmente.

## Solução de Problemas

### As alterações não estão aparecendo no site

Se você alterou um arquivo JavaScript (como constellation.js) e as alterações não estão aparecendo no site, verifique:

1. **Execute o script de deploy**: Certifique-se de executar `./aws/deploy.sh` após fazer alterações
2. **Invalide o cache do CloudFront**: Responda "s" quando perguntado sobre invalidar o cache
3. **Limpe o cache do navegador**: Pressione Ctrl+F5 (ou Cmd+Shift+R no Mac) para forçar uma atualização completa
4. **Verifique o console do navegador**: Abra as ferramentas de desenvolvedor (F12) e verifique se há erros

### Como o sistema detecta alterações em arquivos

O sistema agora usa hashing de conteúdo (MD5) para detectar alterações em arquivos. Isso significa que:

- Qualquer alteração no conteúdo de um arquivo será detectada automaticamente
- Não é necessário fazer nada especial além de executar o script de deploy
- O Terraform compara o hash do arquivo local com o hash do arquivo no S3