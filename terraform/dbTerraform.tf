provider "aws" {
  region = "us-east-1" 
}

resource "aws_dynamodb_table" "users" {
  name           = "users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Environment = "Dev"
  }
}

resource "aws_dynamodb_table" "stocks" {
  name         = "stocks"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "symbol"
    type = "S"
  }

  hash_key  = "userId"
  range_key = "symbol"

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = {
    Environment = "production"
    Team        = "development"
  }
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "tangoOfTheMangoHTTPApi"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "prod_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "prod"
  auto_deploy = true
}

#Root
resource "aws_apigatewayv2_route" "get_root" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /"
}

#Alerts
resource "aws_apigatewayv2_route" "get_alerts_userId" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /alerts/{userId}"
}

resource "aws_apigatewayv2_route" "post_alerts_userId" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /alerts/{userId}"
}

#Auth
resource "aws_apigatewayv2_route" "post_auth_signup" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /auth/signup"
}

resource "aws_apigatewayv2_route" "post_auth_login" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /auth/login"
}

#Portfolio
resource "aws_apigatewayv2_route" "delete_portfolio_userId_remove" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "DELETE /portfolio/{userId}"
}

resource "aws_apigatewayv2_route" "get_portfolio_userId_performance" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /portfolio/{userId}/performance"
}

resource "aws_apigatewayv2_route" "get_portfolio_userId_allocation" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /portfolio/{userId}/allocation"
}

resource "aws_apigatewayv2_route" "delete_portfolio_asset_remove" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "DELETE /portfolio/{userId}/assets/{symbol}/remove"
}

resource "aws_apigatewayv2_route" "post_portfolio_create" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /portfolio/create"
}

resource "aws_apigatewayv2_route" "post_portfolio_assets" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /portfolio/assets"
}

resource "aws_apigatewayv2_route" "post_stock_history" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /stock/{symbol}/history"
}

resource "aws_apigatewayv2_route" "get_stock_history" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /stock/{symbol}/history"
}

resource "aws_apigatewayv2_route" "post_stock_performance" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /stock/{symbol}/performance"
}

resource "aws_apigatewayv2_route" "get_stock_performance" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /stock/{symbol}/performance"
}

resource "aws_apigatewayv2_route" "get_stock_compare" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /stock/{symbol}/compare"
}

resource "aws_apigatewayv2_route" "any_tango_of_the_mangos_lambda" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /tangoOfTheMangosLambda"
}

resource "aws_lambda_function" "tango_lambda" {
  function_name = "tangoOfTheMangoLambda"
  runtime       = "nodejs18.x" 
  handler       = "index.handler"
  role          = "arn:aws:iam::019429731738:role/LabRole"
  filename      = "./TangoMano.zip"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.tango_lambda.arn
}

resource "aws_lambda_permission" "apigateway_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tango_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*"
}