import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "chroma_db")

def get_vectorstore():
    # Use LLM_API_KEY as the primary key since it's the standard Gemini key (AIzaSy...)
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("CHATBOT_API_KEY")
    if not api_key:
        print("Warning: No Gemini API key found. Vectorstore will fail.")
        
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=api_key
    )
    
    return Chroma(
        collection_name="ecommerce_data",
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH
    )

def ingest_data(data_list, data_type="product"):
    """
    Ingests raw dictionaries into the vector store.
    data_list: list of dictionaries representing products, competitors, or alerts.
    """
    if not data_list:
        return 0
        
    store = get_vectorstore()
    docs = []
    ids = []
    
    for item in data_list:
        # Create a textual representation of the item for the LLM to search over
        content_parts = []
        for k, v in item.items():
            if k not in ['_id', 'id'] and v is not None:
                content_parts.append(f"{k}: {v}")
                
        content = " | ".join(content_parts)
        
        # Attempt to find a unique ID
        doc_id = str(item.get("sku", item.get("id", item.get("_id", hash(content)))))
        
        doc = Document(
            page_content=content,
            metadata={"type": data_type, "id": doc_id}
        )
        docs.append(doc)
        ids.append(f"{data_type}_{doc_id}")
        
    if docs:
        # We use explicit IDs to update existing documents instead of duplicating
        store.add_documents(documents=docs, ids=ids)
        
    return len(docs)

def get_retriever(k=3):
    store = get_vectorstore()
    return store.as_retriever(search_kwargs={"k": k})
