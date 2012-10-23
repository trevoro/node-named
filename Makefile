NODEUNIT 	:= ./node_modules/.bin/nodeunit
BUNYAN 		:= ./node_modules/.bin/bunyan
NPM 		:= $(shell which npm)

.PHONY: setup
setup: $(NPM)
	$(NPM) install

.PHONY: test
test: $(NODEUNIT)
	$(NODEUNIT) test/*.test.js $(BUNYAN)


