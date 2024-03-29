#!/usr/bin/env python
#coding:utf-8
# Author:  mozman
# Purpose: setup
# Created: 08.09.2010
# License: MIT License
# Copyright (C) 2010-2012  Manfred Moitzi


import os
from setuptools import setup

VERSION = '1.1.9'  # also update __init__.py
AUTHOR_NAME = 'Manfred Moitzi'
AUTHOR_EMAIL = 'mozman@gmx.at'


def read(fname):
    try:
        return open(os.path.join(os.path.dirname(__file__), fname)).read()
    except IOError:
        return "File '%s' not found.\n" % fname


setup(name='svgwrite',
      version=VERSION,
      description='A Python library to create SVG drawings.',
      author=AUTHOR_NAME,
      url='http://bitbucket.org/mozman/svgwrite',
      download_url='http://bitbucket.org/mozman/svgwrite/downloads',
      author_email=AUTHOR_EMAIL,
      packages=['svgwrite', 'svgwrite/data'],
      provides=['svgwrite'],
      install_requires=['pyparsing>=2.0.1'],
      long_description=read('README.rst') + read('NEWS.rst'),
      platforms="OS Independent",
      license="MIT License",
      classifiers=[
          "Development Status :: 5 - Production/Stable",
          "License :: OSI Approved :: MIT License",
          "Operating System :: OS Independent",
          "Programming Language :: Python :: 2.7",
          "Programming Language :: Python :: 3",
          "Programming Language :: Python :: 3.4",
          "Programming Language :: Python :: 3.5",
          "Programming Language :: Python :: Implementation :: CPython",
          "Programming Language :: Python :: Implementation :: PyPy",
          "Intended Audience :: Developers",
          "Topic :: Multimedia :: Graphics",
          "Topic :: Software Development :: Libraries :: Python Modules",
      ]
)
