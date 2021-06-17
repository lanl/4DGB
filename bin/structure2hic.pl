#!/usr/bin/perl
use strict;
use warnings;

use feature qw(say);

=head1 NAME

gtk_pdb2hic.pl - Generate a contact map from structure data

=head1 SYNOPSIS

    gtk_structure2hic.pl [-h|--help] PDB_FILE

For the LANL 4D Genome Browser Project:

Given a PDB file (the file that is parsed to generate structure data),
output tab-delimited data giving a rough contact map of the structure by
calculating the euclidian distance between every pair points.

=cut

use Getopt::Long qw(:config auto_help);
use Pod::Usage qw(pod2usage);

GetOptions;

my $filename = shift;
defined $filename or pod2usage;

open my $fh, '<', $filename or die "Could not open '$filename': $!";

my @pts;

while (<$fh>) {
    next unless /^ATOM/;
    my @columns = split ' ';
    my @pt = split ' ', substr $_, 26;

    push @pts, { id => $columns[1], x => $pt[0], y => $pt[1], z => $pt[2] }
}

for my $i (@pts) {
for my $j (@pts) {

    my $dist = sqrt(
        ( ($i->{x} - $j->{x}) ** 2) +
        ( ($i->{y} - $j->{y}) ** 2) +
        ( ($i->{z} - $j->{z}) ** 2)
    );

    say join "\t", $i->{id}, $j->{id}, $dist;
}
}

1;
