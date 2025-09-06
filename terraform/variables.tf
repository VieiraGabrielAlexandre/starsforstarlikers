variable "aws_region" {
  default = "sa-east-1"
}

variable "bucket_name" {
  description = "Nome único do bucket S3"
}

variable "site_dir" {
  description = "Diretório dos arquivos do site"
  default     = "../"
}