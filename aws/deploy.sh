#!/bin/bash

# Script para fazer deploy das alterações em JavaScript para o site Stars for Starlikers
# Este script deve ser executado a partir do diretório raiz do projeto

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando deploy das alterações para o site Stars for Starlikers...${NC}"

# Verificar se estamos no diretório raiz do projeto
if [ ! -d "terraform" ] || [ ! -d "src" ]; then
  echo "Erro: Este script deve ser executado a partir do diretório raiz do projeto."
  echo "Por favor, navegue para o diretório que contém as pastas 'terraform' e 'src'."
  exit 1
fi

# Navegar para o diretório terraform
echo -e "${YELLOW}Navegando para o diretório terraform...${NC}"
cd terraform

# Executar terraform apply para fazer upload dos arquivos para o S3
echo -e "${YELLOW}Executando terraform apply para fazer upload dos arquivos...${NC}"
terraform apply -auto-approve

# Verificar se o terraform apply foi bem-sucedido
if [ $? -ne 0 ]; then
  echo "Erro: Falha ao executar terraform apply."
  exit 1
fi

# Obter o ID da distribuição CloudFront
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)

# Verificar se conseguimos obter o ID da distribuição
if [ -z "$DISTRIBUTION_ID" ]; then
  echo -e "${YELLOW}Aviso: Não foi possível obter o ID da distribuição CloudFront automaticamente.${NC}"
  echo -e "${YELLOW}Se você quiser invalidar o cache do CloudFront, você precisará fazer isso manualmente:${NC}"
  echo -e "1. Acesse o Console AWS: https://console.aws.amazon.com/cloudfront/"
  echo -e "2. Selecione sua distribuição"
  echo -e "3. Vá para a aba 'Invalidations'"
  echo -e "4. Crie uma nova invalidação com o padrão '/src/*'"
else
  # Perguntar se o usuário quer invalidar o cache do CloudFront
  echo -e "${YELLOW}Deseja invalidar o cache do CloudFront para ver as alterações imediatamente? (s/n)${NC}"
  read -r response
  if [[ "$response" =~ ^([sS]|[sS][iI][mM])$ ]]; then
    echo -e "${YELLOW}Invalidando o cache do CloudFront...${NC}"
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/src/*"
    
    # Verificar se a invalidação foi bem-sucedida
    if [ $? -ne 0 ]; then
      echo "Erro: Falha ao criar invalidação do CloudFront."
      echo "Verifique se você tem o AWS CLI instalado e configurado corretamente."
      echo "Você pode instalar o AWS CLI com: pip install awscli"
      echo "E configurar com: aws configure"
      exit 1
    fi
  else
    echo -e "${YELLOW}Cache do CloudFront não foi invalidado.${NC}"
    echo -e "${YELLOW}As alterações podem levar até 1 hora para serem visíveis devido ao cache do CloudFront.${NC}"
  fi
fi

# Voltar para o diretório raiz
cd ..

echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}Suas alterações em JavaScript foram enviadas para o S3.${NC}"

# Exibir URLs
S3_URL=$(cd terraform && terraform output -raw s3_website_url 2>/dev/null)
CLOUDFRONT_URL=$(cd terraform && terraform output -raw cloudfront_url 2>/dev/null)

if [ ! -z "$S3_URL" ]; then
  echo -e "${GREEN}URL do S3: http://$S3_URL${NC}"
fi

if [ ! -z "$CLOUDFRONT_URL" ]; then
  echo -e "${GREEN}URL do CloudFront: https://$CLOUDFRONT_URL${NC}"
fi

echo -e "${YELLOW}Nota: Se você não invalidou o cache do CloudFront, as alterações podem levar até 1 hora para serem visíveis.${NC}"