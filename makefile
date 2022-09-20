SCRATCHDIR="testing/scratch"
TESTDIR="${SCRATCHDIR}/test.00"

tests:
	@rm -rf ${SCRATCHDIR} 
	@mkdir ${SCRATCHDIR} 
	@mkdir ${TESTDIR} 
	@mkdir ${TESTDIR}/testing

	@cp -rf client-py/*    	${TESTDIR}
	@cp testing/test_gene-query.py ${TESTDIR}/testing
	@cp testing/test_gentk_debug.py ${TESTDIR}/testing
	@cp testing/test_gentk_production.py ${TESTDIR}/testing
	@cp testing/__init__.py ${TESTDIR}/testing
	@cp testing/testfunctions.py ${TESTDIR}/testing
