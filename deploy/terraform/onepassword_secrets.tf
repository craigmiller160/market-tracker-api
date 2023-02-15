data "onepassword_item" "terraform_client" {
  vault = "k6xneqw7nf5f2fm4azxhbdrcji"
  uuid = "2tkhev4w3khzz5q6uf3otwtl6u"
}

locals {
  terraform_client = {
    client_id = data.onepassword_item.terraform_client.section[0].field[0].value
    client_secret = data.onepassword_item.terraform_client.section[0].field[1].value
  }
}