import yaml
import pytest

from src.domains.obsidian.router import ObsidianDumper

def test_obsidian_dumper_exact_wikilink():
    """Test that exact wikilinks are wrapped in double quotes."""
    data = {"link": "[[My Note]]"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    # The output should have double quotes around "[[My Note]]"
    assert 'link: "[[My Note]]"' in result

def test_obsidian_dumper_normal_string():
    """Test that normal strings are dumped without quotes."""
    data = {"text": "Just a normal string"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    # The output should not have quotes for normal string
    assert 'text: Just a normal string' in result

def test_obsidian_dumper_partial_wikilink():
    """Test that strings containing a wikilink but not exclusively are handled normally."""
    data = {"text": "Go to [[My Note]] for more info"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: Go to [[My Note]] for more info' in result

def test_obsidian_dumper_starts_with_brackets():
    """Test string that starts with [[ but does not end with ]]"""
    data = {"text": "[[Incomplete"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: \'[[Incomplete\'' in result or 'text: "[[Incomplete"' in result or 'text: [[Incomplete' in result

def test_obsidian_dumper_ends_with_brackets():
    """Test string that ends with ]] but does not start with [["""
    data = {"text": "Incomplete]]"}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: Incomplete]]' in result or 'text: \'Incomplete]]\'' in result or 'text: "Incomplete]]"' in result

def test_obsidian_dumper_empty_string():
    """Test that empty string is handled correctly."""
    data = {"text": ""}
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'text: \'\'' in result or 'text: ""' in result or 'text:' in result

def test_obsidian_dumper_nested_dict():
    """Test within a nested dictionary."""
    data = {
        "properties": {
            "tags": ["tag1", "tag2"],
            "related": "[[Related Note]]"
        }
    }
    result = yaml.dump(data, Dumper=ObsidianDumper)
    assert 'related: "[[Related Note]]"' in result
    assert 'tags:\n' in result
