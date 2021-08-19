use pest_derive::Parser;
use pest::Parser;

#[cfg(debug_assertions)]
const _GRAMMAR: &str = include_str!("map_name.pest");

#[derive(Parser)]
#[grammar = "map_name.pest"]
pub struct MapNameParser;

pub fn map_name(input: &str) -> Vec<Fragment> {
    let parsed = MapNameParser::parse(Rule::name, input).unwrap().next().unwrap();
    name_from_pest(parsed)
}

pub fn map_name_string(input: &str) -> String {
    let mut result = String::new();
    for frag in map_name(input) {
        match frag {
            Fragment::Text(txt) => result.push_str(txt),
            Fragment::Tag(_) => (),
        }
    }

    result
}

#[derive(Debug, PartialEq, Eq)]
pub enum Fragment<'a> {
    Tag(Tag),
    Text(&'a str),
}

#[derive(Debug, PartialEq, Eq)]
pub enum Tag {
    Italic,
    Shadowed,
    Wide,
    Narrow,
    Normal,
    DefaultColor,
    Bold,
    ResetAll,
    Capitals,
    Color(u8, u8, u8),
}

use pest::iterators::Pair;
pub fn name_from_pest(frags: Pair<Rule>) -> Vec<Fragment> {
    let mut result = Vec::new();
    for frag in frags.into_inner() {
        match frag.as_rule() {
            Rule::tag => {
                if let Some(pair) = frag.into_inner().next() {
                    result.push(Fragment::Tag(Tag::from_pest(pair)));
                }
            }
            Rule::text => {
                result.push(Fragment::Text(frag.as_str()));
            }
            _ => unreachable!(),
        }
    }

    result
}

impl Tag {
    fn from_pest(parsed: Pair<Rule>) -> Self {
        match parsed.as_rule() {
            Rule::italic => Tag::Italic,
            Rule::shadowed => Tag::Shadowed,
            Rule::wide => Tag::Wide,
            Rule::narrow => Tag::Narrow,
            Rule::normal => Tag::Normal,
            Rule::default_color => Tag::DefaultColor,
            Rule::bold => Tag::Bold,
            Rule::reset => Tag::ResetAll,
            Rule::capitals => Tag::Capitals,
            Rule::color => Self::color(parsed.as_str()),
            _ => unreachable!(),
        }
    }

    fn color(hex: &str) -> Self {
        let (r, g, b) = (&hex[0..1], &hex[1..2], &hex[2..3]);
        let r = u8::from_str_radix(r, 16).unwrap();
        let g = u8::from_str_radix(g, 16).unwrap();
        let b = u8::from_str_radix(b, 16).unwrap();

        Self::Color(r, g, b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use Tag::*;

    #[test]
    fn pest() {
        let input = "$w$s$i$a$afa$afgFortuna atra$wction";

        let actual = map_name(input);

        let expected = vec![
            Fragment::Tag(
                Wide,
            ),
            Fragment::Tag(
                Shadowed,
            ),
            Fragment::Tag(
                Italic,
            ),
            Fragment::Tag(
                Color(
                    10,
                    15,
                    10,
                ),
            ),
            Fragment::Text(
                "Fortuna atra",
            ),
            Fragment::Tag(
                Wide,
            ),
            Fragment::Text(
                "ction",
            ),
        ];

        assert_eq!(expected, actual);
    }
}