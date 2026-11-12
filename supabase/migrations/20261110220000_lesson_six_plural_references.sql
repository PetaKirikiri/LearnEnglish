-- Add these/those; preserve existing question IDs and learner evidence.
begin;
insert into public.english_word_forms(id,form) values ('en:these','these'),('en:those','those') on conflict do nothing;
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values
('identify-v1-these-phone',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-phone',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-bag',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-bag',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-cup',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-cup',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-key',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-key',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-bottle',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-bottle',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-plate',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-plate',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-book',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-book',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-shoe',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-shoe',1,'What are those?',array['those','that'],'those','those'),
('identify-v1-these-hat',1,'What are these?',array['these','those'],'these','these'),
('identify-v1-those-hat',1,'What are those?',array['those','these'],'those','those'),
('identify-v1-these-apple',1,'What are these?',array['these','this'],'these','these'),
('identify-v1-those-apple',1,'What are those?',array['those','that'],'those','those')
on conflict(id,version) do nothing;
commit;
