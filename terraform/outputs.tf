output "s3_website_url" {
  value = aws_s3_bucket.site.website_endpoint
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.cdn.id
  description = "ID da distribuição CloudFront para invalidação de cache"
}