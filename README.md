# Treatment Recommender System

Making sense of the vast amount of healthcare data being gathered every day has become both a 
genuine difficulty and a big opportunity. The tools we frequently see in other industries, such as 
recommender systems, can be very helpful in recommending the appropriate course of action or 
medication based on a patient's medical history. Previously it was used to assist users in finding 
films or products online, these technologies are now being used to improve clinical decision
making in the healthcare industry. 

![recondation](https://github.com/user-attachments/assets/bea4bdda-394d-4ca9-a8cc-dde2539c88de)

![loaded data](https://github.com/user-attachments/assets/28cd8bc0-a04b-4bc3-b092-56931f54f511)

This project introduces a drug recommendation system built as part of a healthcare web 
application. The goal is simple but powerful: by examining the past treatment of people with 
comparable medical conditions, it assists healthcare providers in making better pharmaceutical 
decisions. The system employs a number of data-driven strategies. After identifying patients with 
comparable diagnoses through collaborative filtering, it compares drug usage patterns using 
hybrid similarity techniques, which combine Pearson correlation and cosine similarity. I used 
clustering algorithms (KMeans) to find deeper correlations between pharmaceuticals, and I used 
co-usage analysis to display drugs that are frequently prescribed together for useful suggestions. 

The frontend is created with React and TypeScript, the backend is constructed with Python 
(FastAPI), and the data is saved in PostgreSQL using OMOP-standard formats. With patient
specific advice displayed in a dashboard view, the interface is made to be easy to understand and 
helpful to physicians. Our tests utilising actual condition data demonstrated that, despite the 
system's status as a prototype, it could offer insightful and rational recommendations, much like 
skilled medical professionals might. 

In order to assist healthcare practitioners, this paper explains the system's architecture and 
design, the reasoning behind its algorithms, and the methods in which I have represented the 
outcomes. I also consider the ethical issues surrounding automated health advice, how such a 
system may be used in routine clinical settings, and how this kind of technology might influence 
personalised medicine in the future. My research demonstrates how complex patient data may 
be transformed into useful, actionable insights by fusing clever algorithms with simple design. 
Take action.
