#!/bin/bash

export ARCH_VERSION="x86_64"
export ENVIRONMENT='ocp 4.12 x86_64'
export TS_SELENIUM_BASE_URL='https://devspaces.com'
export DELETE_WORKSPACE_ON_FAILED_TEST='true'
export DELETE_SCREENCAST_IF_TEST_PASS='true'
export NODE_TLS_REJECT_UNAUTHORIZED='0'
export TS_OCP_LOGIN_PAGE_PROVIDER_TITLE='htpasswd'
export TS_SELENIUM_DELAY_BETWEEN_SCREENSHOTS='1000'
export TS_SELENIUM_EDITOR='che-code'
export TS_SELENIUM_EXECUTION_SCREENCAST='false'
export TS_SELENIUM_HEADLESS='false'
export TS_SELENIUM_LAUNCH_FULLSCREEN='true'
export TS_SELENIUM_LOG_LEVEL='TRACE'
export TS_SELENIUM_OCP_PASSWORD=''
export TS_SELENIUM_OCP_USERNAME=''
export TS_SELENIUM_REPORT_FOLDER='./report'
export TS_SELENIUM_USERNAME='che'
export TS_SELENIUM_VALUE_OPENSHIFT_OAUTH='true'
#export TS_SELENIUM_HEADLESS='true'
echo $TS_SELENIUM_BASE_URL
