#!/bin/sh

function import {
  terraform \
    import \
    -var="onepassword_token=$ONEPASSWORD_TOKEN"\
    "$1" "$2"
}

function plan {
  terraform plan \
    -var "onepassword_token=$ONEPASSWORD_TOKEN"
}

import "keycloak_openid_client.market_tracker_api_dev" "apps-dev/317db42f-e456-4f67-8445-58898eb0f12c"
import "keycloak_openid_client.market_tracker_api_prod" "apps-prod/95994ef7-2cf9-410d-915f-6ccc65a97370"

import "keycloak_role.market_tracker_api_access_role_dev" "apps-dev/816a4bec-b308-403c-a071-ead516008ccb"
import "keycloak_role.market_tracker_api_access_role_prod" "apps-prod/68c593c3-786a-4b8a-a7ab-ad47bb1da610"

plan