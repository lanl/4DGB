SCRATCHDIR=testing/scratch
TESTDIR=$(SCRATCHDIR)/test.00

tests: pytests jstests

pytests:
	@if [ ! -d "$(SCRATCHDIR)" ]; then\
		echo "Creating scratch dir";\
		mkdir $(SCRATCHDIR);\
	fi
	@if [ -d "$(TESTDIR)" ]; then\
		echo "Removing test dir";\
		rm -rf $(TESTDIR);\
	fi
	mkdir $(TESTDIR)

	@cp -rf client-py/gentk $(TESTDIR) 
	@cp testing/__init__.py $(TESTDIR)
	@cp testing/test_gene-query.py $(TESTDIR)
	@cp testing/test_gentk_debug.py $(TESTDIR)
	@cp testing/testfunctions.py $(TESTDIR)

	@cd $(TESTDIR); pytest -vv test_gene-query.py
	@cd $(TESTDIR); pytest -vv test_gentk_debug.py

jstests:
	@cd client-js; npm run test --detectOpenHandles tests/client-js.test.js
	@cd client-js; npm run test --detectOpenHandles tests/selection.test.js
