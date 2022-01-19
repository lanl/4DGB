import argparse
import sys
import os
import shutil
from pathlib import Path
import logging


class workflow():

    def __init__(self):
        self.appdir = os.path.join(Path.home(), ".genflow")
        self.projectdir = os.path.join(self.appdir, "projects")
        self.logfile = os.path.join(self.appdir, "genflow.log")

        # set basic logging
        # logging.basicConfig(format='%(levelname)s: %(message)s', filename=self.logfile, level=logging.DEBUG)
        logging.basicConfig(format='%(levelname)s: %(message)s', stream=sys.stdout, level=logging.DEBUG)

    #
    # create a project, copying files into the database
    #
    def create(self, projectname, infile):
        """! Create a project from input data

        @param projectname  the name of the new project
        @param infile       the input file for the new project
        """
        # create the project if the input file exists
        if os.path.isfile(infile):
            self.init()

            # create project directory, if it's not there
            if not os.path.isdir(self.projectdir):
                os.mkdir(self.projectdir)

            # make a new project directory, if it's not already there
            newprojectdir = os.path.join(self.projectdir, projectname)
            infile_base   = os.path.basename(infile)
            if not os.path.isdir(newprojectdir):
                os.mkdir(newprojectdir)

                try:
                    shutil.copyfile(infile, os.path.join(newprojectdir, infile_base))

                # If source and destination are same
                except shutil.SameFileError:
                    logging.error("Source and destination represents the same file.")

                # If destination is a directory.
                except IsADirectoryError:
                    logging.error("Destination is a directory.")

                # If there is any permission issue
                except PermissionError:
                    logging.error("Permission denied.")

                # For other errors
                except:
                    logging.error("Error occurred while copying file.")

            else:
                # warn
                logging.error("project \'{}\' already exists".format(projectname))
        else:
            logging.error("file \'{}\' does not exist".format(args.input))

    def init(self):
        # create the application data directory
        if not os.path.isdir(self.appdir):
            os.mkdir(self.appdir)

        # create the project directory
        if not os.path.isdir(self.projectdir):
            os.mkdir(self.projectdir)

    def remove(self):
        parser = argparse.ArgumentParser(
            description='remove a project')
        # NOT prefixing the argument with -- means it's not optional

        parser.add_argument('project')
        args = parser.parse_args(sys.argv[2:])

        # remove the project if the input file exists
        projectdir = os.path.join(self.projectdir, args.project)
        try:
            shutil.rmtree(projectdir)
        except OSError as e:
            logging.error("%s - %s." % (e.filename, e.strerror))


    def list(self):
        if os.path.isdir(self.projectdir):
            subfolders= [f.path for f in os.scandir(self.projectdir) if f.is_dir()]
            subfolders.sort()
            for d in subfolders:
                print(os.path.basename(d))

    def structure(self):
        parser = argparse.ArgumentParser(
            description='Download objects and refs from another repository')
        # NOT prefixing the argument with -- means it's not optional
        parser.add_argument('repository')
        args = parser.parse_args(sys.argv[2:])
        logging.info('Running subcommand structure, repository=%s' % args.repository)

    def view(self):
        parser = argparse.ArgumentParser(
            description='view a project')
        # NOT prefixing the argument with -- means it's not optional
        parser.add_argument('project')
        args = parser.parse_args(sys.argv[2:])

        logging.info("Viewing {}".format(os.path.join( self.projectdir, args.project)))
