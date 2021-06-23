import setuptools

setuptools.setup(
    name="gentk",
    version="0.5.2",
    author="David H. Rogers",
    author_email="dhr@lanl.gov",
    description="4D Genome Toolkit.",
    url="https://github.com/lanl/4DGB",
    include_package_data=True,
    packages=[  "gentk", 
                "gentk.client"
            ],
    install_requires=[
        "pypac==0.15.0"
    ],
    scripts=[
        "bin/gentk-dump"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: BSD License",
        "Operating System :: OS Independent",
    ],
)
