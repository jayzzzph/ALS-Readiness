from collections.abc import Callable
from typing import Any


def print_decorator2(fun: Callable[..., Any]) -> Callable[..., Any]:

    def wrapper(*args, **kwargs) -> Any:
        fun(*args, **kwargs)
        print("Im in 2")

    return wrapper


def print_decorator1(fun: Callable[..., Any]) -> Callable[..., Any]:

    def wrapper(*args, **kwargs):
        fun(*args, **kwargs)
        print("Im in 1")

    return wrapper


@print_decorator2
@print_decorator1
def say_name(name: str) -> None:
    print("My name is" + name)


@print_decorator1
def say_name_age(name: str, **kwargs) -> None:
    print(f"My name is {name} and my age is {kwargs.get("age")}")


say_name("Gab")