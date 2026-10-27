begin;
insert into public.english_word_forms(id,form,lemma_id) values('en:ac','ac','en:ac') on conflict do nothing;
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values
('tonight-AC-the',1,'Where is the AC?',array['เครื่องปรับอากาศอยู่ที่ไหน','เครื่องปรับอากาศของฉันอยู่ที่ไหน'],'เครื่องปรับอากาศอยู่ที่ไหน','Where is the AC?'),
('tonight-AC-my',1,'Where is my AC?',array['เครื่องปรับอากาศของฉันอยู่ที่ไหน','เครื่องปรับอากาศของคุณอยู่ที่ไหน'],'เครื่องปรับอากาศของฉันอยู่ที่ไหน','Where is my AC?'),
('tonight-AC-your',1,'Where is your AC?',array['เครื่องปรับอากาศของคุณอยู่ที่ไหน','เครื่องปรับอากาศของฉันอยู่ที่ไหน'],'เครื่องปรับอากาศของคุณอยู่ที่ไหน','Where is your AC?'),
('tonight-AC-the-complete',1,'Where is the AC?',array['Correct','Wrong'],'Correct','Where is the AC?'),
('tonight-AC-the-missing-is',1,'Where the AC?',array['Correct','Wrong'],'Wrong',null),
('tonight-AC-my-complete',1,'Where is my AC?',array['Correct','Wrong'],'Correct','Where is my AC?'),
('tonight-AC-my-missing-is',1,'Where my AC?',array['Correct','Wrong'],'Wrong',null),
('tonight-AC-your-complete',1,'Where is your AC?',array['Correct','Wrong'],'Correct','Where is your AC?'),
('tonight-AC-your-missing-is',1,'Where your AC?',array['Correct','Wrong'],'Wrong',null)
on conflict(id,version) do nothing;
commit;
