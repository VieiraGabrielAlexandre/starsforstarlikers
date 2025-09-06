# Guia de Deploy - Stars for Starlikers

Este documento explica como fazer deploy das alterações em JavaScript e outros arquivos para o site Stars for Starlikers.

## Pré-requisitos

Antes de fazer o deploy, certifique-se de que você tem:

1. **Terraform instalado** - [Instruções de instalação](https://learn.hashicorp.com/tutorials/terraform/install-cli)
2. **AWS CLI instalado** (opcional, para invalidação de cache) - [Instruções de instalação](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
3. **AWS credenciais configuradas** - Execute `aws configure` se você planeja usar a invalidação de cache do CloudFront

## Como fazer deploy das alterações em JavaScript

### Método Simples (Script Automatizado)

1. Faça suas alterações nos arquivos JavaScript (ou outros arquivos do site)
2. Navegue até o diretório raiz do projeto (onde estão as pastas `src`, `terraform`, etc.)
3. Execute o script de deploy:

```bash
./aws/deploy.sh
```

4. O script irá:
   - Executar `terraform apply` para fazer upload dos arquivos para o S3
   - Perguntar se você deseja invalidar o cache do CloudFront
   - Mostrar as URLs do site ao finalizar

### Método Manual

Se preferir fazer o deploy manualmente:

1. Faça suas alterações nos arquivos JavaScript (ou outros arquivos do site)
2. Navegue até o diretório `terraform`:

```bash
cd terraform
```

3. Execute o Terraform para fazer upload dos arquivos:

```bash
terraform apply
```

4. (Opcional) Para ver as alterações imediatamente, invalide o cache do CloudFront:
   - Obtenha o ID da distribuição CloudFront:
   ```bash
   terraform output cloudfront_distribution_id
   ```
   - Use o AWS CLI para criar uma invalidação:
   ```bash
   aws cloudfront create-invalidation --distribution-id SEU_ID_AQUI --paths "/src/*"
   ```

## Entendendo o Processo de Deploy

Quando você faz deploy, o seguinte acontece:

1. **Upload para S3**: Todos os arquivos do projeto são enviados para o bucket S3 `starsforstarslikers`
2. **Detecção de Alterações**: O sistema usa hashing MD5 (etag) para detectar alterações nos arquivos
3. **Distribuição via CloudFront**: O CloudFront serve os arquivos do S3 com cache
4. **Cache do CloudFront**: As alterações podem levar até 1 hora para serem visíveis devido ao cache do CloudFront, a menos que você faça uma invalidação

### Como o Sistema Detecta Alterações em Arquivos

O Terraform foi configurado para usar o parâmetro `etag` com a função `filemd5()` para detectar alterações nos arquivos:

```hcl
resource "aws_s3_object" "site_files" {
  # ... outras configurações ...
  etag = filemd5("${var.site_dir}/${each.value}")
}
```

Isso significa que:
- Qualquer alteração no conteúdo de um arquivo será detectada automaticamente
- O Terraform compara o hash MD5 do arquivo local com o hash do arquivo no S3
- Se o conteúdo do arquivo mudar, o hash mudará e o Terraform atualizará o arquivo no S3

## URLs do Site

Após o deploy, o site estará disponível em:

- **URL do S3**: http://starsforstarslikers.s3-website-sa-east-1.amazonaws.com (acesso direto)
- **URL do CloudFront**: Obtida com `terraform output cloudfront_url` (recomendado para usuários)

## Solução de Problemas

### As alterações não estão aparecendo no site

Se você alterou um arquivo JavaScript (como constellation.js) e as alterações não estão aparecendo no site:

1. **Certifique-se de executar o script de deploy**:
   ```bash
   ./aws/deploy.sh
   ```
   
2. **Invalide o cache do CloudFront**: Responda "s" quando perguntado sobre invalidar o cache durante o deploy

3. **Limpe o cache do navegador**: 
   - Chrome/Firefox: Pressione Ctrl+F5 (ou Cmd+Shift+R no Mac)
   - Safari: Pressione Option+Cmd+E para limpar o cache, depois Cmd+R para recarregar

4. **Verifique o console do navegador**: 
   - Abra as ferramentas de desenvolvedor (F12 ou Cmd+Option+I no Mac)
   - Verifique a aba "Console" para erros
   - Na aba "Network", verifique se os arquivos JavaScript estão sendo carregados corretamente

5. **Verifique se o arquivo foi atualizado no S3**:
   - Acesse o Console AWS: https://console.aws.amazon.com/s3/
   - Navegue até o bucket `starsforstarslikers`
   - Localize o arquivo que você alterou e verifique a data de "Last modified"

### Erro ao executar o script de deploy

- Verifique se o script tem permissão de execução: `chmod +x aws/deploy.sh`
- Certifique-se de estar no diretório raiz do projeto

### Erro ao executar Terraform

- Verifique se o Terraform está instalado: `terraform --version`
- Verifique se suas credenciais AWS estão configuradas corretamente

### Erro ao invalidar o cache do CloudFront

- Verifique se o AWS CLI está instalado: `aws --version`
- Verifique se suas credenciais AWS estão configuradas: `aws configure`
- Certifique-se de que o ID da distribuição CloudFront está correto