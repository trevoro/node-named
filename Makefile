NPM 		:= $(shell which npm)

.PHONY: setup
setup: $(NPM)
	$(NPM) install

.PHONY: test
test: $(NPM)
	$(NPM) test
