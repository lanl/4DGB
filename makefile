SCRATCHDIR=testing/scratch
TESTDIR=$(SCRATCHDIR)/test.00
TESTINGDIR=$(TESTDIR)/testing

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
	@if [ -d "$(TESTINGDIR)" ]; then\
		echo "Removing testing dir";\
		rm -rf $(TESTINGDIR);\
	fi
	mkdir $(TESTINGDIR)

	@cp -rf client-py/gentk $(TESTDIR) 
	@cp testing/__init__.py $(TESTINGDIR)
	@cp testing/test_gene-query.py $(TESTINGDIR)
	@cp testing/test_gentk_debug.py $(TESTINGDIR)
	@cp testing/testfunctions.py $(TESTINGDIR)

	@cd $(TESTDIR); pytest -vv testing/test_gene-query.py
	@cd $(TESTDIR); pytest -vv testing/test_gentk_debug.py

jstests:
	@cd client-js; npm run test --detectOpenHandles tests/client-js.test.js
	@cd client-js; npm run test --detectOpenHandles tests/selection.test.js
