import setuptools

long_description = open('readme.md').read()

setuptools.setup(
    name="gentk",
    version="1.1.0",
    author="David H. Rogers",
    author_email="dhr@lanl.gov",
    description="4D Genome Toolkit.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/lanl/4DGB",
    include_package_data=True,
    package_data={'': ['license.md', 'readme.md']},
    packages=[  "gentk", 
                "gentk.client",
                "gentk.project",
                "gentk.workflow"
            ],
    install_requires=[
        "pypac==0.15.0"
    ],
    scripts=[
        "genex",
        "genflow"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: BSD License",
        "Operating System :: OS Independent",
    ],
)
