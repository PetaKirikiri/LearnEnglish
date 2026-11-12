-- Additive Lesson 6 listening questions; preserve all learner history.
begin;
insert into public.english_word_forms(id,form) values
('en:this','this'),
('en:that','that'),
('en:over','over'),
('en:there','there')
on conflict do nothing;
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values
('identify-v1-this-phone',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-phone',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-phone',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-bag',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-bag',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-bag',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-cup',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-cup',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-cup',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-key',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-key',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-key',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-bottle',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-bottle',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-bottle',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-plate',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-plate',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-plate',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-book',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-book',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-book',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-shoe',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-shoe',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-shoe',1,'What is that over there?',array['that over there','that'],'that over there','that over there'),
('identify-v1-this-hat',1,'What is this?',array['this','that'],'this','this'),
('identify-v1-that-hat',1,'What is that?',array['that','that over there'],'that','that'),
('identify-v1-over-there-hat',1,'What is that over there?',array['that over there','this'],'that over there','that over there'),
('identify-v1-this-apple',1,'What is this?',array['this','that over there'],'this','this'),
('identify-v1-that-apple',1,'What is that?',array['that','this'],'that','that'),
('identify-v1-over-there-apple',1,'What is that over there?',array['that over there','that'],'that over there','that over there')
on conflict(id,version) do nothing;
commit;
