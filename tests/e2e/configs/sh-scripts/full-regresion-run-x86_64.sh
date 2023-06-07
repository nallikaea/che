#!/bin/bash
# shellcheck source=/dev/null

########################################
############# Methods ##################
########################################
export ARCH_VERSION="x86_64"

launchAPITests() {
  export MOCHA_SUITE="APITest"
  echo "MOCHA_SUITE = ${MOCHA_SUITE}"
  npm run driver-less-test
}

launchDelayedAPITests() {
  export MOCHA_SUITE="DelayedAPITest"
  echo "MOCHA_SUITE = ${MOCHA_SUITE}"
  npm run devfile-acceptance-test-suite
}

launchUITests() {
  export MOCHA_SUITE="UITest"
  echo "MOCHA_SUITE = ${MOCHA_SUITE}"
  npm run test
}

launchAllTests() {
  echo ""
  echo "Launching all tests for $ARCH_VERSION $OCP_VERSION"
  echo ""
  launchUITests
  launchAPITests
  launchDelayedAPITests
}

########################################
############# Launching ################
########################################


export OCP_VERSION="airgap-ocp-413"
source "suits/$ARCH_VERSION/$OCP_VERSION/InitEnvironmental.sh" &&
launchAllTests
export OCP_VERSION="ocp4-12"
source "suits/$ARCH_VERSION/$OCP_VERSION/InitEnvironmental.sh" &&
launchAllTests
export OCP_VERSION="ocp4-13"
source "suits/$ARCH_VERSION/$OCP_VERSION/InitEnvironmental.sh" &&
launchAllTests
