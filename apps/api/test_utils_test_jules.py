from utils_test_jules import reverse_string

def test_reverse_string_standard():
    assert reverse_string("hello") == "olleh"

def test_reverse_string_empty():
    assert reverse_string("") == ""

def test_reverse_string_numbers():
    assert reverse_string(12345) == "54321"
