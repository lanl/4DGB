SCRATCHDIR=testing/scratch
TESTDIR=$(SCRATCHDIR)/test.00
TESTINGDIR=$(TESTDIR)/testing

tests: pytests jstests

pytests:
	@echo "------------------------------------------------"
	@echo "If tests fail, build and restart project test.00"
	@echo "------------------------------------------------"
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
	@echo "------------------------------------------------"
	@echo "If tests fail, build and restart project test.00"
	@echo "------------------------------------------------"
	@cd client-js; npm run test --detectOpenHandles tests/client-js.test.js
	@cd client-js; npm run test --detectOpenHandles tests/selection.test.js

update-version:
	@./bin/update_version
