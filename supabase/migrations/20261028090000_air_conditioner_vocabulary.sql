begin;
insert into public.english_word_forms(id,form,lemma_id) values('en:air','air','en:air'),('en:conditioner','conditioner','en:conditioner') on conflict do nothing;
insert into public.english_word_questions(id,version,sentence,choices,answer,credit_sentence) values
('tonight-air conditioner-the',1,'Where is the air conditioner?',array['เครื่องปรับอากาศอยู่ที่ไหน','เครื่องปรับอากาศของฉันอยู่ที่ไหน'],'เครื่องปรับอากาศอยู่ที่ไหน','Where is the air conditioner?'),
('tonight-air conditioner-my',1,'Where is my air conditioner?',array['เครื่องปรับอากาศของฉันอยู่ที่ไหน','เครื่องปรับอากาศของคุณอยู่ที่ไหน'],'เครื่องปรับอากาศของฉันอยู่ที่ไหน','Where is my air conditioner?'),
('tonight-air conditioner-your',1,'Where is your air conditioner?',array['เครื่องปรับอากาศของคุณอยู่ที่ไหน','เครื่องปรับอากาศของฉันอยู่ที่ไหน'],'เครื่องปรับอากาศของคุณอยู่ที่ไหน','Where is your air conditioner?'),
('tonight-air conditioner-the-complete',1,'Where is the air conditioner?',array['Correct','Wrong'],'Correct','Where is the air conditioner?'),
('tonight-air conditioner-the-missing-is',1,'Where the air conditioner?',array['Correct','Wrong'],'Wrong',null),
('tonight-air conditioner-the-missing-determiner',1,'Where is air conditioner?',array['Correct','Wrong'],'Wrong',null),
('tonight-air conditioner-my-complete',1,'Where is my air conditioner?',array['Correct','Wrong'],'Correct','Where is my air conditioner?'),
('tonight-air conditioner-my-missing-is',1,'Where my air conditioner?',array['Correct','Wrong'],'Wrong',null),
('tonight-air conditioner-my-missing-determiner',1,'Where is air conditioner?',array['Correct','Wrong'],'Wrong',null),
('tonight-air conditioner-your-complete',1,'Where is your air conditioner?',array['Correct','Wrong'],'Correct','Where is your air conditioner?'),
('tonight-air conditioner-your-missing-is',1,'Where your air conditioner?',array['Correct','Wrong'],'Wrong',null),
('tonight-air conditioner-your-missing-determiner',1,'Where is air conditioner?',array['Correct','Wrong'],'Wrong',null)
on conflict(id,version) do nothing;
commit;
